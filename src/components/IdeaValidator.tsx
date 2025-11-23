import { useIdeaStore } from '@/src/stores/ideaStore';
import { Button } from '@/components/ui/button';
import { sendToGemini } from '@/src/lib/gemini';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ValidationResponse {
  verdict: 'APPROVED' | 'REJECTED' | 'NEEDS_REFINEMENT';
  score: number;
  problem: string;
  targetMarket: string;
  businessModel: string;
  competitors: string;
  growthPlan: string;
  legalChecks: string;
  fundingNeeds: string;
  prosAndCons: string;
  brutalReview: string;
}

export function IdeaValidator() {
  const { getActiveIdea, updateIdea } = useIdeaStore();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const activeIdea = getActiveIdea();
  
  if (!activeIdea) {
    return (
      <div className="text-center text-muted-foreground font-mono text-sm py-12">
        Select an idea to validate
      </div>
    );
  }
  
  const handleValidate = async () => {
    if (!activeIdea) return;
    
    setIsValidating(true);
    
    try {
      const validationPrompt = `Validate this startup idea comprehensively and return ONLY valid JSON:

IDEA NAME: ${activeIdea.name}
IDEA DESCRIPTION: ${activeIdea.description}

Provide a BRUTAL, honest validation. Return your response as a JSON object with this EXACT structure (no markdown, no code blocks, just pure JSON):

{
  "verdict": "APPROVED" | "REJECTED" | "NEEDS_REFINEMENT",
  "score": <number between 0-50>,
  "problem": "<analysis of the problem being solved>",
  "targetMarket": "<who needs this and market size>",
  "businessModel": "<how money is made>",
  "competitors": "<who else does this>",
  "growthPlan": "<how to scale>",
  "legalChecks": "<legal risks and considerations>",
  "fundingNeeds": "<funding requirements>",
  "prosAndCons": "<pros and cons>",
  "brutalReview": "<brutally honest final review>"
}

Verdict rules:
- APPROVED: Score 35+ and strong fundamentals
- NEEDS_REFINEMENT: Score 25-34
- REJECTED: Score below 25

Be direct. No sugarcoating. Return ONLY the JSON object, nothing else.`;

      const response = await sendToGemini(validationPrompt);
      
      // Extract JSON from response (handle markdown code blocks if present)
      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      jsonStr = jsonStr.trim();
      
      try {
        const validationData: ValidationResponse = JSON.parse(jsonStr);

        setValidationResult(validationData);

        // Persist to DB
        const patchRes = await fetch('/api/ideas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeIdea.id,
            validated: true,
            validationData: {
              problem: validationData.problem,
              targetMarket: validationData.targetMarket,
              businessModel: validationData.businessModel,
              competitors: validationData.competitors,
              growthPlan: validationData.growthPlan,
              legalChecks: validationData.legalChecks,
              fundingNeeds: validationData.fundingNeeds,
              prosAndCons: validationData.prosAndCons,
              brutalReview: validationData.brutalReview,
            },
          }),
        });

        if (patchRes.ok) {
          const data = await patchRes.json();
          // Update local store using server response for consistency
          updateIdea(activeIdea.id, {
            validated: data.idea.validated,
            validationData: data.idea.validationData ? JSON.parse(data.idea.validationData) : {
              problem: validationData.problem,
              targetMarket: validationData.targetMarket,
              businessModel: validationData.businessModel,
              competitors: validationData.competitors,
              growthPlan: validationData.growthPlan,
              legalChecks: validationData.legalChecks,
              fundingNeeds: validationData.fundingNeeds,
              prosAndCons: validationData.prosAndCons,
              brutalReview: validationData.brutalReview,
            },
          });
        } else {
          // Fallback to local update if server fails
          updateIdea(activeIdea.id, {
            validated: true,
            validationData: {
              problem: validationData.problem,
              targetMarket: validationData.targetMarket,
              businessModel: validationData.businessModel,
              competitors: validationData.competitors,
              growthPlan: validationData.growthPlan,
              legalChecks: validationData.legalChecks,
              fundingNeeds: validationData.fundingNeeds,
              prosAndCons: validationData.prosAndCons,
              brutalReview: validationData.brutalReview,
            },
          });
        }

        toast.success('Validation complete!');
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.error('Response:', response);
        toast.error('Failed to parse validation response. Check console for details.');
      }
    } catch (error) {
      toast.error('Validation failed');
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };
  
  const displayData = validationResult || (activeIdea.validated && activeIdea.validationData ? {
    verdict: 'APPROVED' as const,
    score: 0,
    problem: activeIdea.validationData.problem,
    targetMarket: activeIdea.validationData.targetMarket,
    businessModel: activeIdea.validationData.businessModel,
    competitors: activeIdea.validationData.competitors,
    growthPlan: activeIdea.validationData.growthPlan,
    legalChecks: activeIdea.validationData.legalChecks,
    fundingNeeds: activeIdea.validationData.fundingNeeds,
    prosAndCons: activeIdea.validationData.prosAndCons,
    brutalReview: activeIdea.validationData.brutalReview,
  } : null);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'APPROVED':
        return 'border-green-500 bg-green-500/10 text-green-500';
      case 'REJECTED':
        return 'border-red-500 bg-red-500/10 text-red-500';
      case 'NEEDS_REFINEMENT':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
      default:
        return 'border-border bg-background text-foreground';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'APPROVED':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5" />;
      case 'NEEDS_REFINEMENT':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-mono font-bold text-primary">IDEA VALIDATOR</h2>
        <p className="text-xs font-mono text-muted-foreground">
          {activeIdea.name}
        </p>
      </div>
      
      {!displayData ? (
        <div className="text-center py-12 space-y-4">
          <p className="font-mono text-sm text-muted-foreground">
            Ready to get brutal feedback on this idea?
          </p>
          <Button onClick={handleValidate} disabled={isValidating}>
            {isValidating ? 'VALIDATING...' : 'VALIDATE IDEA'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Verdict Highlight at Top */}
          <Card className={`border-2 ${getVerdictColor(displayData.verdict)}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getVerdictIcon(displayData.verdict)}
                  <span className="text-2xl font-mono uppercase">VERDICT: {displayData.verdict}</span>
                </div>
                {validationResult && (
                  <div className="text-sm font-mono opacity-80">
                    Score: {validationResult.score}/50
                  </div>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            <ValidationSection
              title="Problem Breakdown"
              content={displayData.problem || 'N/A'}
            />
            <ValidationSection
              title="Target Market"
              content={displayData.targetMarket || 'N/A'}
            />
            <ValidationSection
              title="Business Model"
              content={displayData.businessModel || 'N/A'}
            />
            <ValidationSection
              title="Competitors"
              content={displayData.competitors || 'N/A'}
            />
            <ValidationSection
              title="Growth Plan"
              content={displayData.growthPlan || 'N/A'}
            />
            <ValidationSection
              title="Legal Checks"
              content={displayData.legalChecks || 'N/A'}
            />
            <ValidationSection
              title="Funding Needs"
              content={displayData.fundingNeeds || 'N/A'}
            />
            <ValidationSection
              title="Pros & Cons"
              content={displayData.prosAndCons || 'N/A'}
            />
            <div className="border-2 border-accent p-4 bg-accent/5">
              <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">
                🔥 BRUTAL REVIEW
              </h3>
              <p className="font-mono text-sm text-foreground whitespace-pre-wrap">
                {displayData.brutalReview || 'N/A'}
              </p>
            </div>
          </div>
          
          <Button variant="outline" onClick={handleValidate} disabled={isValidating}>
            RE-VALIDATE
          </Button>
        </div>
      )}
    </div>
  );
}

function ValidationSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="border border-border p-3">
      <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="font-mono text-xs text-foreground whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
